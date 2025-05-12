import { useUserData } from '../../backend/user.service';

const Home = () => {
  const { data: users, isLoading, error } = useUserData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Welcome to Chareli</h1>
        <p className="text-gray-700 mb-4">
          This is the home page of your application. The layout with header and footer
          is provided by the Layout component.
        </p>
        
        {/* Example of using React Query data */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">User Data Example</h2>
          
          {isLoading && (
            <p className="text-gray-500">Loading users...</p>
          )}
          
          {error && (
            <p className="text-red-500">Error loading users: {(error as Error).message}</p>
          )}
          
          {users && (
            <div className="bg-gray-100 p-4 rounded">
              <pre className="whitespace-pre-wrap">{JSON.stringify(users, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
