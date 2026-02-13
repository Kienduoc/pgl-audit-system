'use client'

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
] as const;

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const currentLanguage = languages.find(lang => lang.code === locale);

    const switchLanguage = (newLocale: string) => {
        // Store preference
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

        // Update URL
        const currentPathWithoutLocale = pathname.replace(/^\/(en|vi)/, '') || '/';
        const newPath = newLocale === 'en'
            ? currentPathWithoutLocale
            : `/${newLocale}${currentPathWithoutLocale}`;

        router.push(newPath);
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Languages className="h-4 w-4" />
                    <span className="text-lg">{currentLanguage?.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => switchLanguage(lang.code)}
                        className="gap-2 cursor-pointer"
                    >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        {locale === lang.code && (
                            <span className="ml-auto text-xs text-muted-foreground">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
