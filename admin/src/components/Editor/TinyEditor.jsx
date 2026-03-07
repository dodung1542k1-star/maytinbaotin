import { Editor } from '@tinymce/tinymce-react';
import { useRef, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

export default function TinyEditor({ value, onChange }) {
    const editorRef = useRef(null);
    const pickerCallbackRef = useRef(null);

    useEffect(() => {
        const handleMessage = (event) => {
           if (event.origin === API_URL && event.data.type === 'ROXY_FILE_SELECTED') {
                const relativeUrl = event.data.url;
                const fullUrl = `${API_URL}${relativeUrl}`;
                
                if (pickerCallbackRef.current) {
                    pickerCallbackRef.current(fullUrl, { alt: '' });
                    pickerCallbackRef.current = null;
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const openRoxyFileman = (callback) => {
        pickerCallbackRef.current = callback;
        const width = 1100;
        const height = 750;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            `${API_URL}/elfinder/fileman.html`,
            'RoxyFileman',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    return (
        <Editor
            apiKey="8th58086kevk4htd3xaz4akklxxf9sh9ionrp1nngby3yvcp"
            value={value}
            onInit={(evt, editor) => (editorRef.current = editor)}
            onEditorChange={onChange}
            init={{
                height: 800,
                width: '100%',
                
                /** --- CẤU HÌNH QUAN TRỌNG ĐỂ HIỆN ẢNH CŨ --- **/
                relative_urls: false,       // Không sử dụng đường dẫn tương đối
                remove_script_host: false,  // Không xóa domain khỏi đường dẫn ảnh
                convert_urls: true,         // Tự động chuyển đổi URL
                document_base_url: `${API_URL}/`, // Gốc tọa độ cho các đường dẫn ảnh
                /** ----------------------------------------- **/

                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'preview', 
                    'code', 'table', 'visualblocks', 'wordcount', 'searchreplace',
                    'fullscreen', 'media', 'emoticons', 'directionality'
                ],

                toolbar: 'undo redo | blocks fontfamily fontsize | ' +
                         'bold italic underline strikethrough | forecolor backcolor | ' +
                         'alignleft aligncenter alignright alignjustify | ' +
                         'bullist numlist outdent indent | link image media | ' +
                         'removeformat | code fullscreen preview',

                font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',

                file_picker_types: 'image',
                file_picker_callback: (callback, value, meta) => {
                    if (meta.filetype === 'image') {
                        openRoxyFileman(callback);
                    }
                },
                
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
        />
    );
}