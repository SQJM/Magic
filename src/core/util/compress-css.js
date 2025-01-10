export const compressCSS = ( css ) => {
	const compressedCSS = css.replace( /\s+/g, ' ' ).trim();

	return compressedCSS.replace( / +/g, ' ' );
}