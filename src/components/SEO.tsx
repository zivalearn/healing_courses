import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  courseSchema?: {
    name: string;
    description: string;
    provider: string;
    price: number;
    currency: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
  };
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Course Catalogue | Heal With Heer LMS Academy',
  description = 'Explore accredited certification courses in Usui Reiki, Master NLP, Timeline Therapy®, and Energy Healing guided by Master Heer.',
  keywords = 'Reiki, Master NLP, Timeline Therapy, Energy Healing, Chakra Alchemy, Heal With Heer, LMS, Online Certification',
  image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
  url = typeof window !== 'undefined' ? window.location.href : '',
  courseSchema,
}) => {
  useEffect(() => {
    // Update Title
    document.title = title;

    // Helper to update or create meta tag
    const updateMetaTag = (nameAttr: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);

    // Open Graph Meta Tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'og:url', url);
    updateMetaTag('property', 'og:type', courseSchema ? 'website' : 'article');

    // Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);

    // JSON-LD Structured Data Schema for LMS Course
    let scriptTag = document.getElementById('json-ld-course-schema') as HTMLScriptElement | null;
    if (courseSchema) {
      const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: courseSchema.name,
        description: courseSchema.description,
        provider: {
          '@type': 'Organization',
          name: courseSchema.provider || 'Heal With Heer Academy',
          sameAs: 'https://healwithheer.com',
        },
        offers: {
          '@type': 'Offer',
          price: courseSchema.price,
          priceCurrency: courseSchema.currency || 'USD',
          category: 'Online Certification',
        },
        image: courseSchema.image || image,
        ...(courseSchema.rating && courseSchema.reviewCount
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: courseSchema.rating,
                reviewCount: courseSchema.reviewCount,
                bestRating: '5',
                worstRating: '1',
              },
            }
          : {}),
      };

      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'json-ld-course-schema';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLdData);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, image, url, courseSchema]);

  return null;
};

export default SEO;
