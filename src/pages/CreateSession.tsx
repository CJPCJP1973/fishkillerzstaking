import Layout from "@/components/Layout";
import CreateSessionForm from "@/components/CreateSessionForm";

export default function CreateSession() {
  return (
    <Layout>
      <div className="container py-8 pb-24 md:pb-8">
        <CreateSessionForm />
      </div>
    </Layout>
  );
}
