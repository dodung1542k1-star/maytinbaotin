exports.getCategoryTree = async (req, res) => {
    try {
        // Sử dụng hàm lấy tất cả từ model
        const categories = await categoryModel.getCategoryTreeAdmin(); 
        const tree = buildCategoryTree(categories);
        res.json({ success: true, data: tree });
    } catch (err) {
        console.error('getCategoryTree error:', err);
        res.status(500).json({ success: false });
    }
};
và exports.getCategoryTreeAdmin = async () => {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
        SELECT Id, Name, ParentCategoryId, Published
        FROM Category
        WHERE Deleted = 0
        ORDER BY ParentCategoryId, Name
    `);
    return result.recordset;
}; và exports.buildCategoryTree = (categories) => {
    const map = {};
    const roots = [];

    categories.forEach(c => {
        map[c.Id] = { 
            id: c.Id,
            name: c.Name,
            parentId: c.ParentCategoryId,
            published: c.Published,
            children: [] 
        };
    });

    categories.forEach(c => {
        if (c.ParentCategoryId) {
            map[c.ParentCategoryId]?.children.push(map[c.Id]);
        } else {
            roots.push(map[c.Id]);
        }
    });

    return roots;
};
 bạn có thể làm thể tính năng get ra tên seo thân thiệt không vậy