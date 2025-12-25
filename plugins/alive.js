module.exports = {
  route: "/alive",
  method: "get",
  handler: (req, res) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    res.json({
      status: "alive",
      message: "💖 IZUMI LITE Bot is running!",
      uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      timestamp: new Date().toISOString()
    });
  }
};
