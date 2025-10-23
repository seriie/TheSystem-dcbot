import { nanoid } from "nanoid";

export function nanoIdFormat(id, length) {
    const date = new Date().toLocaleDateString().replace(/\//g, '');
    const finalId = id + date + nanoid(length);
    const userId = finalId.toUpperCase();
    return userId;
}