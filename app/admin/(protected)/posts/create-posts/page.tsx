import PostForm from "@/components/Post-Form";


export default function NewPostPage() {
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <PostForm />
    </div>
  );
}