export const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}