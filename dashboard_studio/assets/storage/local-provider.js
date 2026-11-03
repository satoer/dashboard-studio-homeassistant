class LocalProvider extends StorageProvider {

    // Local provider doesn't need specific initialization
    init() {
        return Promise.resolve();
    }

    // Listing files isn't possible in the browser sandbox for local disk
    list(type) {
        return Promise.resolve([]);
    }

    // "Save" here means downloading a file to the user's computer
    save(type, name, data) {
        return new Promise((resolve, reject) => {
            try {
                // Determine filename extension
                let filename = name;
                if (!filename.toLowerCase().endsWith('.json')) {
                    filename += '.json';
                }

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    // "Load" here means opening a file picker and reading the selected file
    load(type, name) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    // User cancelled or no file selected
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const json = JSON.parse(event.target.result);
                        resolve({ data: json, filename: file.name });
                    } catch (err) {
                        reject(new Error("Failed to parse JSON file: " + err.message));
                    }
                };
                reader.onerror = () => reject(new Error("Error reading file"));
                reader.readAsText(file);
            };

            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    }

    delete(type, name) {
        return Promise.reject(new Error("Cannot delete local files"));
    }
}

// Register as the 'local' provider
StorageRegistry.register('local', LocalProvider);