// RedirectPage.tsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const RedirectPage = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Get the "link" parameter from the URL
        const link = searchParams.get('link');
        if (link) {
            // Redirect to the custom URL scheme
            window.location.href = link;
        }
    }, [searchParams]);

    return (
        <div>
            <p>
                Redirecting... If you are not redirected automatically,{' '}
                <a href={searchParams.get('link') || '#'}>click here</a>.
            </p>
        </div>
    );
};

export default RedirectPage;
