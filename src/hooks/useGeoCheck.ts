import { useEffect, useState } from 'react';
import { cacheUtility } from '../utils/cacheUtility'; // Adjust path as necessary

const useGeoCheck = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timeoutHandler = setTimeout(() => {
            setError('Geo-check request timed out.');
        }, 500);

        const checkGeoLocation = () => {
            // Implement geo-checking logic
            const cachedLocation = cacheUtility.getLocation();
            if (cachedLocation) {
                setLocation(cachedLocation);
                clearTimeout(timeoutHandler);
                return;
            }

            // Example: Fetch geo data or your geo-checking process
            fetch('https://ipapi.co/json/')
                .then(response => response.json())
                .then(data => {
                    setLocation(data);
                    cacheUtility.setLocation(data);
                    clearTimeout(timeoutHandler);
                })
                .catch(err => {
                    setError('Error fetching geo data: ' + err);
                    console.error('Geo-check error:', err);
                    clearTimeout(timeoutHandler);
                });
        };

        checkGeoLocation();

        return () => clearTimeout(timeoutHandler);
    }, []);

    return { location, error };
};

export default useGeoCheck;
