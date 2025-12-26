import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

function cmToInches(cm) {
    return cm / 2.54
}

export async function POST(req) {
    try {
        const body = await req.json()
        const { imageBase64, paperSize = 'ti', quantity = 1 } = body
        if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

        const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches) return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
        const mime = matches[1]
        const b64 = matches[2]
        const imgBuffer = Buffer.from(b64, 'base64')

        const sizeMap = {
            ti: { w: 2.5, h: 3 },
            tc: { w: 4, h: 4 },
            tap: { w: 9, h: 13 },
        }
        const target = sizeMap[paperSize] || { w: 4, h: 3 }

        const POINTS_PER_INCH = 72
        const pageInches = { w: 8.5, h: 11 }
        const pageWpt = pageInches.w * POINTS_PER_INCH
        const pageHpt = pageInches.h * POINTS_PER_INCH

        const targetWpt = cmToInches(target.w) * POINTS_PER_INCH
        const targetHpt = cmToInches(target.h) * POINTS_PER_INCH

        const marginCm = 2.5
        const gapCm = 0.5
        const marginPt = cmToInches(marginCm) * POINTS_PER_INCH
        const gapPt = cmToInches(gapCm) * POINTS_PER_INCH

        const usableW = Math.max(0, pageWpt - marginPt * 2)
        const usableH = Math.max(0, pageHpt - marginPt * 2)

        const cols = Math.max(1, Math.floor((usableW + gapPt) / (targetWpt + gapPt)))
        const rows = Math.max(1, Math.floor((usableH + gapPt) / (targetHpt + gapPt)))
        const perPage = cols * rows

        const meta = await sharp(imgBuffer).metadata()
        const srcW = meta.width
        const srcH = meta.height
        const srcAspect = srcW / srcH
        const targetAspect = (target.w / target.h)

        let sx = 0, sy = 0, sw = srcW, sh = srcH
        if (Math.abs(srcAspect - targetAspect) > 0.001) {
            if (srcAspect > targetAspect) {
                sw = Math.round(srcH * targetAspect)
                sx = Math.round((srcW - sw) / 2)
            } else {
                sh = Math.round(srcW / targetAspect)
                sy = Math.round((srcH - sh) / 2)
            }
        }

        const DPI = 300
        const targetWpx = Math.round((target.w / 2.54) * DPI)
        const targetHpx = Math.round((target.h / 2.54) * DPI)

        const sourceIsPng = /png/i.test(mime)
        let processedBuffer
        let outputMime
        if (sourceIsPng) {
            processedBuffer = await sharp(imgBuffer)
                .extract({ left: sx, top: sy, width: sw, height: sh })
                .resize(targetWpx, targetHpx, { fit: 'fill' })
                .png()
                .toBuffer()
            outputMime = 'image/png'
        } else {
            processedBuffer = await sharp(imgBuffer)
                .extract({ left: sx, top: sy, width: sw, height: sh })
                .resize(targetWpx, targetHpx, { fit: 'fill' })
                .jpeg({ quality: 90 })
                .toBuffer()
            outputMime = 'image/jpeg'
        }

        const pdfDoc = await PDFDocument.create()

        let embeddedImage
        const outMime = outputMime || mime
        if (/png/i.test(outMime)) {
            embeddedImage = await pdfDoc.embedPng(processedBuffer)
        } else {
            embeddedImage = await pdfDoc.embedJpg(processedBuffer)
        }

        const remainingTotal = Math.max(1, Number(quantity || 1))
        let remaining2 = remainingTotal
        while (remaining2 > 0) {
            const page = pdfDoc.addPage([pageWpt, pageHpt])
            const toDraw = Math.min(remaining2, perPage)
            for (let i = 0; i < toDraw; i++) {
                const col = i % cols
                const row = Math.floor(i / cols)
                const dx = marginPt + col * (targetWpt + gapPt)
                const dyFromTop = marginPt + row * (targetHpt + gapPt)
                const y = pageHpt - dyFromTop - targetHpt
                page.drawImage(embeddedImage, { x: dx, y, width: targetWpt, height: targetHpt })
            }
            remaining2 -= toDraw
        }

        const pdfBytes = await pdfDoc.save()
        return new Response(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename=generated.pdf',
            },
        })
    } catch (err) {
        console.error('generate-pdf error', err)
        return NextResponse.json({ error: 'Server error generating PDF' }, { status: 500 })
    }
}
