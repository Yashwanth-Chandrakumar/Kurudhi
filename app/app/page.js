export default function Home() {
  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Kurudhi Kodai</h1>
      <p className="mb-4">
        Kurudhi Kodai is a platform that connects blood donors with those in need. Join our community and help save
        lives!
      </p>
      <div className="space-x-4">
        <a href="/become-donor" className="btn-primary">
          Become a Donor
        </a>
        <a href="/request-donor" className="btn-primary">
          Request Blood
        </a>
      </div>
    </div>
  )
}

