import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export async function POST(request) {
  await dbConnect();

  try {
    const { username, code, action } = await request.json();
    const decodedUsername = decodeURIComponent(username);
    let user = await UserModel.findOne({ username: decodedUsername });

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'sendCode') {
      // Generate a new 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verifyCode = verificationCode;
      user.verifyCodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      await user.save();

      console.log(`Verification code sent: ${verificationCode}`);
      return Response.json(
        { success: true, message: 'Verification code sent.' },
        { status: 200 }
      );
    } 
    
    if (action === 'verifyCode') {
      console.log("Stored Expiry:", user.verifyCodeExpiry);
      console.log("Current Time:", new Date());

      const isCodeValid = user.verifyCode === code;
      const isCodeNotExpired = user.verifyCodeExpiry && new Date(user.verifyCodeExpiry) > new Date();

      if (isCodeValid && isCodeNotExpired) {
        user.isVerified = true;
        user.verifyCode = null; // Clear the code
        user.verifyCodeExpiry = null;
        await user.save();

        return Response.json(
          { success: true, message: 'Account verified successfully' },
          { status: 200 }
        );
      } else if (!isCodeNotExpired) {
        return Response.json(
          { success: false, message: 'Verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      } else {
        return Response.json(
          { success: false, message: 'Incorrect verification code' },
          { status: 400 }
        );
      }
    }

    return Response.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error handling verification:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
