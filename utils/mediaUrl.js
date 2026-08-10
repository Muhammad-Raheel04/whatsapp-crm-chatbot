export const toPublicMediaUrl = (filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    const base = process.env.PUBLIC_BASE_URL; 
    return `${base}/${normalized}`;
};