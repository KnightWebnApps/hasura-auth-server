const { verify } = require('jsonwebtoken')

const getUserId = (req) => {
  console.log(process.env.JWT_SECRET);
  const Authorization = req.get('Authorization') || ''
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const verifiedToken = verify(token, process.env.PRIVATE_KEY)
    return verifiedToken.userId
  }
}

module.exports = { getUserId }
