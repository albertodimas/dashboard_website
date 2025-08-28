SELECT c.id, c.email, c.name, c."tenantId", COUNT(pp.id) as total_purchases
FROM customers c
LEFT JOIN package_purchases pp ON c.id = pp."customerId"
WHERE c.email = 'walny.mc@gmail.com'
GROUP BY c.id, c.email, c.name, c."tenantId";