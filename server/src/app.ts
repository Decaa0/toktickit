app.get('/api/requesters/active', async (req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(requesters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active requesters' });
  }
});