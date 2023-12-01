const presets = {
    "glow": "text-shadow: 0 0 5px currentColor;",
    "h1" : "font-size: 60px;",
    "red": "color: red;",
    "blue": "color: blue;"
};

window.onload = function() {
    const editor = document.getElementById('editor');

    editor.addEventListener('input', function() {
        renderMarkup(editor.value);
        saveLocally();
    });
    
    editor.value = localStorage.getItem("editor");
    renderMarkup(editor.value);
};

function renderMarkup(text) {
    const stack = [];
    let currentText = '';
    let html = '';

    function applyStyles(text) {
        if (stack.length === 0) return text;

        let style = stack.map(preset => {
            // Check if the preset is a color code
            if (preset.startsWith('#')) {
                // Check for background color code (##)
                if (preset.startsWith('##')) {
                    return `background-color: ${preset.slice(1)};`;
                }
                return `color: ${preset};`;
            }
            return presets[preset] || '';
        }).join(' ');

        return `<span style="${style}">${text}</span>`;
    }

    function isOnlyTag(line) {
        return line.trim().startsWith('[') && line.trim().endsWith(']');
    }

    const lines = text.split('\n');
    lines.forEach((line, index) => {
        let i = 0;
        while (i < line.length) {
            if (line[i] === '[') {
                if (currentText) {
                    html += applyStyles(currentText);
                    currentText = '';
                }

                let j = i;
                while (j < line.length && line[j] !== ']') {
                    j++;
                }

                if (j === line.length) {
                    currentText += line.slice(i);
                    break;
                }

                const tag = line.slice(i + 1, j).trim();
                if (tag[0] !== '/') {
                    stack.push(tag); // Push the tag (style or color code) onto the stack
                } else {
                    if (stack.length > 0) {
                        stack.pop(); // Pop the tag (style or color code) from the stack
                    }
                }
                i = j;
            } else {
                currentText += line[i];
            }
            i++;
        }

        if (currentText) {
            html += applyStyles(currentText);
            currentText = '';
        }

        if (index < lines.length - 1) {  
            html += '<br>';
        }
    });

    document.getElementById('output').innerHTML = html;
}

function saveLocally() {
    const editor = document.getElementById('editor');
    localStorage.setItem("editor", editor.value);
}