const { createSlug } = require('./stringUtils');
exports.buildCategoryTree = (categories) => {
    const map = {};
    const roots = [];

    categories.forEach(c => {
        map[c.Id] = { 
            id: c.Id,
            name: c.Name,
            // TẠO SLUG Ở ĐÂY
            slug: c.Slug || createSlug(c.Name), 
            parentId: c.ParentCategoryId,
            published: c.Published,
            children: [] 
        };
    });

    categories.forEach(c => {
        if (c.ParentCategoryId && map[c.ParentCategoryId]) {
            map[c.ParentCategoryId].children.push(map[c.Id]);
        } else if (!c.ParentCategoryId) {
            roots.push(map[c.Id]);
        }
    });

    return roots;
};