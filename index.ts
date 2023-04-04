import { getPrivateMessagingKey } from "@mailchain/sdk/internal";
import { KeyRing } from "@mailchain/keyring";
import { MailSender } from "@mailchain/sdk/internal";
import { ED25519PrivateKey } from "@mailchain/crypto";
import { decodeHex } from "@mailchain/encoding";
import { encodeHex } from "@mailchain/encoding";
import "dotenv/config";

const createPrivateMessagingKey = async () => {
  const keyRing = KeyRing.fromSecretRecoveryPhrase(
    process.env.SECRET_KEY_RECOVERY_PHRASE as string
  );

  const mailchainAddress = process.env.MAILCHAIN_ADDRESS as string;

  const { data: privateMessagingKey, error: getPrivateMessagingKeyError } =
    await getPrivateMessagingKey(mailchainAddress, keyRing);

  if (getPrivateMessagingKeyError) throw getPrivateMessagingKeyError;

  return encodeHex(privateMessagingKey.publicKey.bytes);
};

const bootstrap = async () => {
  const privateMessagingKeyBytes = await createPrivateMessagingKey();

  console.log('✅ private messaging key bytes created:', privateMessagingKeyBytes)

  const recoveredPrivateMessagingKey = ED25519PrivateKey.fromSeed(
    decodeHex(privateMessagingKeyBytes)
  );

  console.log('✅ recovered private messaging key:', recoveredPrivateMessagingKey.bytes)

  const mailchainAddress = process.env.MAILCHAIN_ADDRESS as string;

  const { data: sentMail, error: sendMailError } =
    await MailSender.fromSenderMessagingKey(
      recoveredPrivateMessagingKey
    ).sendMail({
      from: mailchainAddress,
      to: [`0x8ebdc1c3c2d4e0b77831f654cdde5e9e5b0909e5@ethereum.mailchain.com`],
      subject: "My first message",
      content: {
        text: "Hello Mailchain 👋",
        html: "<p>Hello Mailchain 👋</p>",
      },
    });

    if (sendMailError) {
    console.log('❌ send mail error:',sendMailError)
    throw sendMailError;
  }

  console.log(`✅ Message sent successfully: ${sentMail}`);
};

bootstrap();
