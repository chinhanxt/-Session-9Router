

interface HighlightedJsonProps {
  json: string;
}

export function HighlightedJson({ json }: HighlightedJsonProps) {
  if (!json) return null;
  
  const lines = json.split('\n');
  return (
    <pre className="text-[11px] font-mono select-text leading-relaxed p-1">
      {lines.map((line, i) => {
        // Tìm kiếm các cặp key: value
        const keyMatch = line.match(/^(\s*)"([^"]+)":/);
        if (keyMatch) {
          const indent = keyMatch[1];
          const key = keyMatch[2];
          const rest = line.substring(keyMatch[0].length);
          
          // Định dạng màu sắc dựa trên kiểu dữ liệu của value
          let valueSpan = <span className="text-slate-700">{rest}</span>;
          if (rest.includes('"')) {
            // Chuỗi ký tự (Màu xanh lá nhẹ)
            valueSpan = <span className="text-emerald-600 font-medium">{rest}</span>;
          } else if (rest.includes('true') || rest.includes('false')) {
            // Boolean (Màu hồng đào)
            valueSpan = <span className="text-rose-500 font-semibold">{rest}</span>;
          } else if (rest.match(/\d+/)) {
            // Số (Màu chàm)
            valueSpan = <span className="text-indigo-500 font-semibold">{rest}</span>;
          } else if (rest.includes('null')) {
            // Null (Màu xám nhạt)
            valueSpan = <span className="text-slate-400 italic">{rest}</span>;
          }
          
          return (
            <div key={i} className="hover:bg-purple-50/60 px-1 rounded transition-colors">
              <span className="text-slate-350">{indent}</span>
              <span className="text-purple-600 font-semibold">"{key}"</span>
              <span className="text-slate-400">:</span>
              {valueSpan}
            </div>
          );
        }
        
        return (
          <div key={i} className="hover:bg-purple-50/60 px-1 rounded transition-colors text-slate-400">
            {line}
          </div>
        );
      })}
    </pre>
  );
}
