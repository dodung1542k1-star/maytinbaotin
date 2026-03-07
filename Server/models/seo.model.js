const { pool } = require('../config');

const seoService = {
    // --- PHẦN SEO TRANG CHỦ ---
    getHomePageSeo: async () => {
        try {
            const [rows] = await pool.execute(`
                SELECT Name, Value 
                FROM setting 
                WHERE Name IN (
                    'commonsettings.defaulttitle', 
                    'commonsettings.defaultmetadescription', 
                    'commonsettings.defaultmetakeywords'
                )
            `);
            
            const seo = {
                'commonsettings.defaulttitle': 'Máy Tính Bảo Tín',
                'commonsettings.defaultmetadescription': 'Chuyên linh kiện máy tính cũ mới',
                'commonsettings.defaultmetakeywords': 'laptop, pc, linh kien'
            };

            rows.forEach(item => {
                seo[item.Name.toLowerCase()] = item.Value;
            });

            return seo;
        } catch (err) {
            throw err;
        }
    },

    updateHomePageSeo: async (data) => {
        try {
            const { title, description, keywords } = data;
            const settings = [
                { name: 'commonsettings.defaulttitle', value: title },
                { name: 'commonsettings.defaultmetadescription', value: description },
                { name: 'commonsettings.defaultmetakeywords', value: keywords }
            ];

            // MySQL dùng cú pháp INSERT ... ON DUPLICATE KEY UPDATE cực kỳ gọn
            // Lưu ý: Cột 'Name' trong bảng setting phải là UNIQUE key
            for (let item of settings) {
                await pool.execute(`
                    INSERT INTO setting (Name, Value, StoreId) 
                    VALUES (?, ?, 0)
                    ON DUPLICATE KEY UPDATE Value = VALUES(Value)
                `, [item.name, item.value]);
            }
            return { success: true };
        } catch (err) {
            console.error("🔥 Lỗi MySQL Update SEO:", err);
            throw err;
        }
    },

    // --- PHẦN MENU CHÂN TRANG (TOPIC) ---
    getFooterMenu: async () => {
        try {
            const [rows] = await pool.execute(`
                SELECT t.Id, t.Title, t.IncludeInFooterColumn1, t.IncludeInFooterColumn2, t.IncludeInFooterColumn3,
                       u.Slug
                FROM topic t
                LEFT JOIN urlrecord u ON t.Id = u.EntityId 
                    AND u.EntityName = 'Topic' 
                    AND u.IsActive = 1
                WHERE t.Published = 1 
                  AND (t.IncludeInFooterColumn1 = 1 OR t.IncludeInFooterColumn2 = 1 OR t.IncludeInFooterColumn3 = 1)
                ORDER BY t.DisplayOrder ASC
            `);
            
            return {
                column1: rows.filter(t => t.IncludeInFooterColumn1),
                column2: rows.filter(t => t.IncludeInFooterColumn2),
                column3: rows.filter(t => t.IncludeInFooterColumn3)
            };
        } catch (err) { throw err; }
    },

    getTopicBySlug: async (slug) => {
        try {
            const [rows] = await pool.execute(`
                SELECT t.*, u.Slug
                FROM topic t
                INNER JOIN urlrecord u ON t.Id = u.EntityId
                WHERE u.EntityName = 'Topic' 
                  AND u.Slug = ? 
                  AND u.IsActive = 1
                LIMIT 1
            `, [slug]);
            return rows[0];
        } catch (err) { throw err; }
    },

    getTopicById: async (identifier) => {
        try {
            // MySQL xử lý chuỗi và số linh hoạt hơn MSSQL
            const [rows] = await pool.execute(`
                SELECT t.*, u.Slug 
                FROM topic t
                LEFT JOIN urlrecord u ON t.Id = u.EntityId 
                    AND u.EntityName = 'Topic' 
                    AND u.IsActive = 1
                WHERE t.Id = ? OR t.SystemName = ?
                LIMIT 1
            `, [identifier, identifier]);
            return rows[0];
        } catch (err) { throw err; }
    },

    updateTopic: async (data) => {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            await connection.execute(`
                UPDATE topic
                SET Title = ?, Body = ?, MetaTitle = ?,
                    MetaKeywords = ?, MetaDescription = ?
                WHERE Id = ?
            `, [data.Title, data.Body, data.MetaTitle || null, data.MetaKeywords || null, data.MetaDescription || null, data.Id]);

            if (data.Slug) {
                const cleanSlug = data.Slug.trim().toLowerCase();
                // Xóa các slug cũ của Topic này
                await connection.execute(`DELETE FROM urlrecord WHERE EntityId = ? AND EntityName = 'Topic'`, [data.Id]);
                // Chèn slug mới
                await connection.execute(`
                    INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId)
                    VALUES (?, 'Topic', ?, 1, 0)
                `, [data.Id, cleanSlug]);
            }

            await connection.commit();
            return { success: true };
        } catch (err) {
            if (connection) await connection.rollback();
            console.error("🔥 Lỗi cập nhật Topic:", err); 
            throw err; 
        } finally {
            if (connection) connection.release();
        }
    },

    createTopic: async (data) => {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [result] = await connection.execute(`
                INSERT INTO topic 
                (
                    SystemName, IncludeInSitemap, IncludeInTopMenu, 
                    IncludeInFooterColumn1, IncludeInFooterColumn2, IncludeInFooterColumn3,
                    Title, Body, Published, MetaKeywords, MetaDescription, MetaTitle, 
                    DisplayOrder, SubjectToAcl, LimitedToStores, TopicTemplateId, AccessibleWhenStoreClosed, IsPasswordProtected
                )
                VALUES (?, 1, 0, ?, 0, 0, ?, ?, 1, ?, ?, ?, 1, 0, 0, 1, 0, 0)
            `, [
                data.SystemName || '', 
                1, // Column1 mặc định hiện
                data.Title, 
                data.Body || '', 
                data.MetaKeywords || null, 
                data.MetaDescription || null, 
                data.MetaTitle || null
            ]);
            
            const newId = result.insertId;

            if (data.Slug) {
                await connection.execute(`
                    INSERT INTO urlrecord (EntityId, EntityName, Slug, IsActive, LanguageId)
                    VALUES (?, 'Topic', ?, 1, 0)
                `, [newId, data.Slug.trim().toLowerCase()]);
            }

            await connection.commit();
            return { success: true, id: newId };
        } catch (err) {
            if (connection) await connection.rollback();
            console.error("🔥 Lỗi tạo mới Topic:", err);
            throw err;
        } finally {
            if (connection) connection.release();
        }
    },

    deleteTopic: async (id) => {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            await connection.execute(`DELETE FROM urlrecord WHERE EntityId = ? AND EntityName = 'Topic'`, [id]);
            await connection.execute(`DELETE FROM topic WHERE Id = ?`, [id]);

            await connection.commit();
            return { success: true };
        } catch (err) {
            if (connection) await connection.rollback();
            throw err;
        } finally {
            if (connection) connection.release();
        }
    }
};

module.exports = seoService;