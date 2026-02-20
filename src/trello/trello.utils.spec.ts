import { createHmac } from 'crypto';
import { verifyTrelloSignature } from './trello.utils';

describe('verifyTrelloSignature', () => {
  const callbackURL = 'https://example.com/webhooks/trello';
  const secret = 'my-secret';

  function computeExpectedHash(
    body: object,
    url: string,
    secretKey: string,
  ): string {
    const content = JSON.stringify(body) + url;
    return createHmac('sha1', secretKey).update(content).digest('base64');
  }

  it('should return true when header matches computed signature', () => {
    const body = { action: { type: 'updateCard' } };
    const expectedHash = computeExpectedHash(body, callbackURL, secret);
    const request = {
      body,
      headers: { 'x-trello-webhook': expectedHash },
    };

    const result = verifyTrelloSignature(request, callbackURL, secret);

    expect(result).toBe(true);
  });

  it('should return false when header does not match', () => {
    const body = { action: { type: 'updateCard' } };
    const request = {
      body,
      headers: { 'x-trello-webhook': 'wrong-hash' },
    };

    const result = verifyTrelloSignature(request, callbackURL, secret);

    expect(result).toBe(false);
  });

  it('should return false when secret is different', () => {
    const body = {};
    const hashWithWrongSecret = computeExpectedHash(
      body,
      callbackURL,
      'other-secret',
    );
    const request = {
      body,
      headers: { 'x-trello-webhook': hashWithWrongSecret },
    };

    const result = verifyTrelloSignature(request, callbackURL, secret);

    expect(result).toBe(false);
  });

  it('should use request.body and callbackURL for content', () => {
    const body = { foo: 'bar' };
    const expectedHash = computeExpectedHash(body, callbackURL, secret);
    const request = {
      body,
      headers: { 'x-trello-webhook': expectedHash },
    };

    expect(verifyTrelloSignature(request, callbackURL, secret)).toBe(true);

    const wrongUrlHash = computeExpectedHash(
      body,
      'https://other.com/webhooks/trello',
      secret,
    );
    request.headers['x-trello-webhook'] = wrongUrlHash;
    expect(verifyTrelloSignature(request, callbackURL, secret)).toBe(false);
  });
});
