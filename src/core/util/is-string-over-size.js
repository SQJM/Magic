export const isStringOverSize = ( str, maxSize ) => {
	const byteLength = new TextEncoder().encode( str ).length;
	return byteLength > maxSize;
}