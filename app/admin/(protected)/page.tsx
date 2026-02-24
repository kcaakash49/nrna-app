"use client";



export default function Page(){
    const handleLogout = async() => {
        const res = await fetch("/api/admin/auth/logout", {
            method:'POST'
        })
    }
    return (<>
        <div>Homepage</div>
        <button onClick={handleLogout}>LogOut</button>
    </>
    )
}