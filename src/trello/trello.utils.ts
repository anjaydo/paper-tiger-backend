import { createHmac } from 'crypto';

export function verifyTrelloSignature(
  request,
  callbackURL: string,
  secret: string,
): boolean {
  const base64Digest = function (s) {
    return createHmac('sha1', secret).update(s).digest('base64');
  };
  const content = JSON.stringify(request.body) + callbackURL;
  const doubleHash = base64Digest(content);
  const headerHash = request.headers['x-trello-webhook'];
  console.log('doubleHash: ', doubleHash);
  console.log('headerHash: ', headerHash);
  return doubleHash == headerHash;
}
