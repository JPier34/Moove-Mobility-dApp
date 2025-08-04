const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <Tab label="Create NFT" component={<AdminNFTCreator />} />
        <Tab label="Manage Auctions" component={<AuctionManager />} />
        <Tab label="User Management" component={<UserManager />} />
        <Tab label="Analytics" component={<AdminAnalytics />} />
      </div>
    </div>
  );
};
