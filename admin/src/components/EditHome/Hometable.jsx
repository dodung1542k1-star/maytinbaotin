import React from 'react';
import { Edit2, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hometable = ({ data, startIndex,onDelete }) => {
    const navigate = useNavigate();

    return (
        <table className="table table-hover align-middle mb-0 border">
            <thead className="table-light border-bottom">
                <tr>
                    <th className="text-center" style={{width: '70px'}}>STT</th>
                    <th>Tên danh mục</th>
                    <th className="text-center" style={{width: '120px'}}>Xuất bản</th>
                    <th className="text-center" style={{width: '120px'}}>Hành động</th>
                </tr>
            </thead>
           <tbody>
                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <tr key={item.Id}>
                            <td className="text-center text-muted">{startIndex + index + 1}</td>
                            <td className="fw-medium text-dark">{item.Title}</td>
                            <td className="text-center">
                                <div className="bg-success-subtle rounded-circle d-inline-flex p-1">
                                    <Check size={16} className="text-success" />
                                </div>
                            </td>
                            <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                    <button className="btn btn-primary btn-sm p-2 shadow-sm border-0" 
                                            onClick={() => navigate(`/admin/home/create/${item.Id}`)}>
                                        <Edit2 size={14} color="white" />
                                    </button>
                                    
                                    {/* NÚT XÓA MỚI */}
                                    <button className="btn btn-danger btn-sm p-2 shadow-sm border-0"
                                            onClick={() => onDelete(item.Id, item.Title)}>
                                        <Trash2 size={14} color="white" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan="4" className="text-center py-4 text-muted">Không có dữ liệu</td></tr>
                )}
            </tbody>
        </table>
    );
};
export default Hometable;