import MainNavbar from "@/components/client/MainNavbar";
import TopNavbar from "@/components/client/TopNavbar";
import { getNavbarMenu } from "@/lib/getNavbarMenu";

export const revalidate = 3600;

export default async function ClientLayout({children} : {children: React.ReactNode}){
    const menu = await getNavbarMenu("MAIN_NAVBAR");
 
    return (
        
        <div>
            <TopNavbar/>
            <MainNavbar menu={menu}/>
            {children}
        </div>
    )
}