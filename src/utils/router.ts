import { useState, useEffect } from 'react';

export type AppRoute =
  | 'home'
  | 'tools'
  | 'guides'
  | 'faq'
  | 'about'
  | 'contact'
  | 'privacy-policy'
  | 'terms'
  | 'meesho-promotional-label'
  | 'flipkart-label-crop'
  | 'amazon-label-crop';

export const ROUTE_PATHS: Record<AppRoute, string> = {
  home: '/',
  tools: '/tools',
  guides: '/guides',
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  'privacy-policy': '/privacy-policy',
  terms: '/terms',
  'meesho-promotional-label': '/meesho-promotional-label',
  'flipkart-label-crop': '/flipkart-label-crop',
  'amazon-label-crop': '/amazon-label-crop',
};

export const parseCurrentRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'home';

  // Check pathname first
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (pathname === '/meesho-promotional-label' || pathname.endsWith('/meesho-promotional-label')) {
    return 'meesho-promotional-label';
  }
  if (pathname === '/flipkart-label-crop' || pathname.endsWith('/flipkart-label-crop')) {
    return 'flipkart-label-crop';
  }
  if (pathname === '/amazon-label-crop' || pathname.endsWith('/amazon-label-crop')) {
    return 'amazon-label-crop';
  }
  if (pathname === '/tools' || pathname.endsWith('/tools')) {
    return 'tools';
  }
  if (pathname === '/guides' || pathname.endsWith('/guides') || pathname.includes('/guides/')) {
    return 'guides';
  }
  if (pathname === '/faq' || pathname.endsWith('/faq')) {
    return 'faq';
  }
  if (pathname === '/about' || pathname.endsWith('/about')) {
    return 'about';
  }
  if (pathname === '/contact' || pathname.endsWith('/contact')) {
    return 'contact';
  }
  if (pathname === '/privacy-policy' || pathname.endsWith('/privacy-policy') || pathname === '/privacy') {
    return 'privacy-policy';
  }
  if (pathname === '/terms' || pathname.endsWith('/terms') || pathname === '/terms-of-service') {
    return 'terms';
  }

  // Also check hash as fallback (e.g. #/meesho-promotional-label or #privacy-policy)
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash.includes('meesho')) return 'meesho-promotional-label';
  if (hash.includes('flipkart')) return 'flipkart-label-crop';
  if (hash.includes('amazon')) return 'amazon-label-crop';
  if (hash === 'tools') return 'tools';
  if (hash.startsWith('guide')) return 'guides';
  if (hash === 'faq') return 'faq';
  if (hash === 'about') return 'about';
  if (hash === 'contact') return 'contact';
  if (hash.includes('privacy')) return 'privacy-policy';
  if (hash.includes('terms')) return 'terms';

  return 'home';
};

export const scrollToTop = () => {
  if (typeof window === 'undefined') return;

  const performScroll = () => {
    // Preserve legitimate anchor/hash navigation if target element exists
    if (window.location.hash) {
      const hashVal = window.location.hash.replace(/^#\/?/, '');
      const isRouteFallback = Object.keys(ROUTE_PATHS).some(
        (r) => ROUTE_PATHS[r as AppRoute].replace(/^\//, '').toLowerCase() === hashVal.toLowerCase()
      );
      if (!isRouteFallback && hashVal) {
        const targetElement = document.getElementById(hashVal);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'auto' });
          return;
        }
      }
    }

    // Scroll immediately to the top of the destination page without smooth scrolling
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  };

  performScroll();
  // Second pass in next animation frame to guarantee scroll position after DOM layout repaint
  requestAnimationFrame(performScroll);
};

export const navigateTo = (route: AppRoute) => {
  const targetPath = ROUTE_PATHS[route] || '/';
  if (typeof window !== 'undefined') {
    try {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new CustomEvent('app-route-change', { detail: route }));
    } catch {
      window.location.hash = targetPath;
    }
    scrollToTop();
  }
};

export const useAppRoute = (): [AppRoute, (route: AppRoute) => void] => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(parseCurrentRoute);

  useEffect(() => {
    // Disable automatic browser scroll restoration so SPA route changes cleanly start at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handlePopState = () => {
      setCurrentRoute(parseCurrentRoute());
      scrollToTop();
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppRoute>;
      if (customEvent.detail) {
        setCurrentRoute(customEvent.detail);
      } else {
        setCurrentRoute(parseCurrentRoute());
      }
      scrollToTop();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app-route-change', handleCustomChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app-route-change', handleCustomChange);
    };
  }, []);

  return [currentRoute, navigateTo];
};
