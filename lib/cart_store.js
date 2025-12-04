const items = []
const subscribers = new Set()
let initialized = false
const STORAGE_KEY = 'cart_items_v1'

function loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                items.length = 0
                parsed.forEach(i => items.push(i))
            }
        }
    } catch (e) {
    }
    initialized = true
}

function saveToStorage() {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
    }
}

function ensureInit() {
    if (!initialized) loadFromStorage()
}

export function addItem(item) {
    ensureInit()
    const idx = item.id != null ? items.findIndex(i => i.id === item.id) : items.findIndex(i => i.name === item.name)
    const addQty = Number(item.qty) || 1
    if (idx >= 0) {
        items[idx].qty = (items[idx].qty || 0) + addQty
    } else {
        items.push({ ...item, qty: addQty })
    }
    subscribers.forEach(fn => fn(getCount(), getItems()))
    saveToStorage()
    return getCount()
}

export function getCount() {
    ensureInit()
    return items.reduce((s, it) => s + (it.qty || 0), 0)
}

export function getItems() {
    ensureInit()
    return items.slice()
}

export function clear() {
    items.length = 0
    subscribers.forEach(fn => fn(getCount(), getItems()))
    saveToStorage()
}

export function subscribe(fn) {
    ensureInit()
    subscribers.add(fn)
    return () => subscribers.delete(fn)
}

export function removeItem(index) {
    if (index >= 0 && index < items.length) {
        items.splice(index, 1)
        subscribers.forEach(fn => fn(getCount(), getItems()))
        saveToStorage()
        return true
    }
    return false
}

export function decrementItem(index) {
    if (index >= 0 && index < items.length) {
        const it = items[index]
        if ((it.qty || 1) > 1) {
            it.qty = (it.qty || 1) - 1
        } else {
            items.splice(index, 1)
        }
        subscribers.forEach(fn => fn(getCount(), getItems()))
        saveToStorage()
        return true
    }
    return false
}
