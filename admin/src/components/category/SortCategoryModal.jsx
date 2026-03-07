import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ category }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1060 : 'auto',
        opacity: isDragging ? 0.6 : 1,
        cursor: 'grab',
        backgroundColor: '#fff',
        padding: '12px',
        border: '1px solid #dee2e6',
        marginBottom: '8px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.15)' : 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <span style={{ marginRight: '15px', color: '#6c757d' }}>☰</span>
            <span style={{ fontWeight: '500' }}>{category.name}</span>
        </div>
    );
};

const SortCategoryModal = ({ categories, onClose, onSave }) => {
    const [items, setItems] = useState(categories);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex(i => i.id === active.id);
                const newIndex = prev.findIndex(i => i.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">Sắp xếp thứ tự Menu</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                        <p className="text-muted small mb-3"><i>* Kéo thả để thay đổi vị trí. Nhấn "Lưu" để cập nhật vào hệ thống.</i></p>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <div className="list-group">
                                    {items.map((cat) => (
                                        <SortableItem key={cat.id} category={cat} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                    <div className="modal-footer bg-light">
                        <button className="btn btn-outline-secondary" onClick={onClose}>Hủy</button>
                        <button className="btn btn-primary px-4" onClick={() => onSave(items)}>Lưu thay đổi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SortCategoryModal;