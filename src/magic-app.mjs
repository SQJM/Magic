import { argv } from 'process';
import path from 'path'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath( import.meta.url )

const __dirname = path.dirname( __filename )

export const __magic_app = {
	runDir : __dirname,
	project : {
		dir : argv[ 3 ],
		srcDir : null
	}
}