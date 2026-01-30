import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    className?: string;
};

export default function Page({ children, className = "" }: Props) {
    return (
        <div className={`px-4 py-6 md:px-8 md:py-10 ${className}`}>
            {children}
        </div>
    );
}
