const presets = {
    "glow": "text-shadow: 0 0 5px currentColor;",
    "large": "font-size: 20px;"
    
};

window.onload = function() {
    const editor = document.getElementById('editor');
    const filename = document.getElementById('filename');

    editor.addEventListener('input', function() {
        renderMarkup(editor.value);
        saveLocally();
    });

    filename.addEventListener('input', function() {
        adjustWidthToContent(filename);
        saveLocally();
    });
    
    editor.value = localStorage.getItem("editor");
    filename.value = localStorage.getItem("filename");
    renderMarkup(editor.value);
    adjustWidthToContent(filename);
};

function downloadFile(url, fileName) {
    fetch(url, { method: 'get', mode: 'no-cors', referrerPolicy: 'no-referrer' })
      .then(res => res.blob())
      .then(res => {
        const aElement = document.createElement('a');
        aElement.setAttribute('download', fileName);
        const href = URL.createObjectURL(res);
        aElement.href = href;
        aElement.setAttribute('target', '_blank');
        aElement.click();
        URL.revokeObjectURL(href);
      });
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

                const tag = line.slice(i + 1, j);
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
    const filename = document.getElementById('filename');
    localStorage.setItem("editor", editor.value);
    localStorage.setItem("filename", filename.value);
}

function adjustWidthToContent(input) {
    // Check if the input is empty
    if (!input.value) {
        // Reset to the minimum width specified in the CSS
        input.style.width = '';
        return;
    }

    const tempSpan = document.createElement('span');
    document.body.appendChild(tempSpan);

    // Apply the same font properties to the span
    tempSpan.style.fontFamily = getComputedStyle(input).fontFamily;
    tempSpan.style.fontSize = getComputedStyle(input).fontSize;
    tempSpan.style.letterSpacing = getComputedStyle(input).letterSpacing;
    tempSpan.style.whiteSpace = 'pre'; // To preserve spaces and tabs

    // Set the text of the span to the input value
    tempSpan.textContent = input.value;

    // Adjust the input width to the span width
    input.style.width = `${tempSpan.offsetWidth}px`;

    // Remove the temporary span element
    document.body.removeChild(tempSpan);
}

function saveToFile() {
    const text = document.getElementById('editor').value;
    const filename = document.getElementById('filename').value;
    const editor = document.getElementById('editor').value;

    if (!filename) {
        alert('Please enter a filename.');
        return;
    }
    // download the file via blob
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);

    downloadFile(url, filename + ".markT");

}

function importFile(file) {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    let editor = document.getElementById('editor');
    let filename = document.getElementById('filename');

    filename.value = file.name.split('.')[0];
    adjustWidthToContent(filename);

    // log result
    reader.onload = function (evt) {
        editor.value = evt.target.result

        renderMarkup(editor.value);
        saveLocally();
    }
}

function findAndReplace() {
    const findText = document.getElementById('findInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    const editor = document.getElementById('editor');

    if (!findText) {
        alert("Please enter the text to find.");
        return;
    }

    // Replace the text
    editor.value = editor.value.split(findText).join(replaceText);

    // Re-render the markup and save the changes
    renderMarkup(editor.value);
    saveLocally();
}

// Get the modal
var modal = document.getElementById("findReplaceModal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Listen for Enter key
document.addEventListener("keydown", function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        findAndReplace();
    }
});

// close modal on Esc
document.addEventListener("keydown", function(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        modal.style.display = "none";
    }
});

// Listen for Ctrl + F
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        modal.style.display = "block";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const resizer = document.getElementById('resizer');
    const output = document.getElementById('output');
    let isResizing = false;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.body.classList.add('no-select');
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) {
            return;
        }
        let offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
        let containerWidth = editor.offsetWidth + output.offsetWidth;
        editor.style.width = (e.clientX - editor.offsetLeft) + 'px';
        output.style.width = (containerWidth - editor.offsetWidth - resizer.offsetWidth) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        isResizing = false;
        document.body.classList.remove('no-select');
    });
});

let isResizing = false; // Define isResizing at the top level of your script

document.addEventListener('mousemove', function(e) {
    if (!isResizing) {
        return;
    }

    let editorWidth = e.clientX - editor.offsetLeft;
    let outputWidth = document.body.offsetWidth - e.clientX;
    let containerWidth = editor.offsetWidth + output.offsetWidth;

    // Check if the resizer is within 100px of either wall
    if (editorWidth < 100) {
        // Make the output section fullscreen
        editor.style.width = '0px';
        output.style.width = '100%';
    } else if (outputWidth < 100) {
        // Make the editor section fullscreen
        editor.style.width = '100%';
        output.style.width = '0px';
    } else {
        // Normal resizing
        editor.style.width = editorWidth + 'px';
        output.style.width = (containerWidth - editor.offsetWidth - resizer.offsetWidth) + 'px';
    }
});

document.addEventListener('mousedown', function(e) {
    isResizing = true;
    document.body.classList.add('no-select');
});

document.addEventListener('mouseup', function(e) {
    isResizing = false;
    document.body.classList.remove('no-select');
});