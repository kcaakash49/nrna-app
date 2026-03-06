export default async function ShowAlbumPhotosPage({params}: {params:{slug:string}}){
    const param = await params;
    const slug = decodeURIComponent(param.slug);
    console.log(slug);
    return (
        <div>
            Photos
        </div>
    )
}