import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function OAuthSuccessPage() {
const { search } = useLocation();

useEffect(() => {
const params = new URLSearchParams(search);
const token = params.get('token');

```
if (token) {
  // Save token
  localStorage.setItem('token', token);

  // 🔥 Force full reload (IMPORTANT)
  window.location.href = '/';
} else {
  window.location.href = '/login';
}
```

}, [search]);

return ( <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4"> <div className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6 text-center"> <div className="text-lg font-semibold">Signing you in...</div> <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
Please wait... </div> </div> </div>
);
}
