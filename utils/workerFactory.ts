export const createWorker = (): Promise<Worker | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  
  return new Promise((resolve, reject) => {
    let initTimeout: NodeJS.Timeout;
    
    try {
      const worker = new Worker(
        new URL('../workers/audioWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Add error handler
      worker.onerror = (error) => {
        clearTimeout(initTimeout);
        console.error('Worker error:', error);
        worker.terminate();
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Handle messages
      worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          clearTimeout(initTimeout);
          console.log('Worker initialized successfully');
          resolve(worker);
        } else if (e.data.type === 'error') {
          clearTimeout(initTimeout);
          console.error('Worker initialization error:', e.data.error);
          worker.terminate();
          reject(new Error(e.data.error));
        }
      };

      // Set initialization timeout (15 seconds)
      initTimeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker initialization timed out'));
      }, 15000);

      // Initialize worker
      worker.postMessage({ type: 'init' });

    } catch (error) {
      clearTimeout(initTimeout);
      console.error('Failed to create worker:', error);
      reject(error);
    }
  });
}; 