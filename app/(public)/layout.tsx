import TopNavbar from "@/components/client/TopNavbar";

export default function ClientLayout({children} : {children: React.ReactNode}){
    return (
        <div>
            <TopNavbar/>
            {children}
        </div>
    )
}