import { compressCSS } from "../util/compress-css.js";

export const BuildMStyle = ( element, build_magic_config, fileName ) => {
	let styleText;
	const style = element.getElementsByTagName( "style" ).at( 0 );
	if ( style ) {
		let result = style.innerHTML || "";
		if ( build_magic_config[ "min-code" ][ "css" ] ) result = compressCSS( result );
		if ( style.hasAttribute( "global" ) ) {
			styleText = result;
		} else {
			styleText = `*[m-name="${ fileName }"] {${ result } }`;
		}
	}
	return styleText;
}