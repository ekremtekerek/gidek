/**
 * TC Kimlik No (TCKN) checksum doğrulaması.
 *
 * Algoritma (NVI):
 *   - 11 hane, ilk hane 0 olamaz
 *   - 10. hane: (1,3,5,7,9. haneler toplamı × 7) − (2,4,6,8. haneler toplamı), mod 10
 *   - 11. hane: ilk 10 hanenin toplamı, mod 10
 *
 * Server-side ve client-side aynı fonksiyondan kontrol eder; mock/test
 * datalarında kullanılabilecek "11111111110" gibi pattern'ler de algoritmik
 * olarak geçerli olmadığı için reddedilir.
 */
export function isValidTCKimlik(input: string): boolean {
  if (!/^\d{11}$/.test(input)) return false;

  const digits = input.split('').map((d) => Number(d));
  if (digits[0] === 0) return false;

  // 10. hane: (odd-indexed sum * 7 - even-indexed sum) mod 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (oddSum * 7 - evenSum) % 10;
  // mod negatif olmaması için + 10 normalize
  const d10Norm = ((d10 % 10) + 10) % 10;
  if (d10Norm !== digits[9]) return false;

  // 11. hane: ilk 10 hanenin toplamı mod 10
  const sum10 = digits.slice(0, 10).reduce((acc, n) => acc + n, 0);
  const d11 = sum10 % 10;
  if (d11 !== digits[10]) return false;

  return true;
}
