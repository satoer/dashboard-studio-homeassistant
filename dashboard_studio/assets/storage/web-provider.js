class WebProvider extends StorageProvider {

    init() {
        return Promise.resolve();
    }

    _getEndpoint(type) {
        if (this.config.endpoints && this.config.endpoints[type]) {
            return this.config.endpoints[type];
        }
        throw new Error(`No endpoint configured for storage type: ${type}`);
    }

    /**
     * List available files from the server
     * Expected API Response: Array of objects [{ id: "file1.json", name: "My Dashboard" }, ...]
     */
    list(type) {
        return new Promise((resolve, reject) => {
            try {
                const endpoint = this._getEndpoint(type);
                fetch(endpoint)
                    .then(response => {
                        if (!response.ok) throw new Error(`Server returned ${response.status}`);
                        return response.json();
                    })
                    .then(data => resolve(data)) // Expecting [ {id, name}, ... ]
                    .catch(err => reject(err));
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Save data to the server
     * Payload: { name: "filename", data: { ...json content... } }
     */
    save(type, name, data) {
        return new Promise((resolve, reject) => {
            try {
                const endpoint = this._getEndpoint(type);
                
                // Ensure name has json extension for consistency
                let filename = name;
                if (!filename.toLowerCase().endsWith('.json')) {
                    filename += '.json';
                }

                const payload = {
                    name: filename,
                    data: data
                };

                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (!response.ok) throw new Error(`Save failed: ${response.statusText}`);
                    return response.json();
                })
                .then(result => resolve(result))
                .catch(err => reject(err));
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Load a specific file from the server
     * Uses the ID returned from list() to fetch content
     */
    load(type, id) {
        return new Promise((resolve, reject) => {
            try {
                const baseEndpoint = this._getEndpoint(type);
                // Construct URL: /api/dashboards/filename.json
                const url = `${baseEndpoint}/${encodeURIComponent(id)}`;

                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error(`Load failed: ${response.status}`);
                        return response.json();
                    })
                    .then(json => {
                        // If the API wraps the data, unwrap it here. 
                        // Assuming API returns the raw stored JSON directly.
                        resolve(json); 
                    })
                    .catch(err => reject(err));
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Delete a file from the server
     */
    delete(type, id) {
        return new Promise((resolve, reject) => {
            try {
                const baseEndpoint = this._getEndpoint(type);
                const url = `${baseEndpoint}/${encodeURIComponent(id)}`;

                fetch(url, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
                        resolve();
                    })
                    .catch(err => reject(err));
            } catch (err) {
                reject(err);
            }
        });
    }
}

// Register as the 'server' provider
StorageRegistry.register('server', WebProvider);