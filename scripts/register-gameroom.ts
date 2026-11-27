/** One requested catalogue addition, not a seed or migration. Dry-run by default. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const cli=createRequire(require.resolve('firebase-tools/package.json'));
const auth=cli('./lib/auth'),{requireAuth}=cli('./lib/requireAuth');
const playUrl=process.argv.find(a=>a.startsWith('--play-url='))?.slice('--play-url='.length)??'https://anicolao.github.io/istanbul/';
const url=new URL(playUrl);
if(url.origin!=='https://anicolao.github.io'||!/^\/istanbul\/(pr\d+\/)?$/.test(url.pathname)||url.search||url.hash)throw Error('Use the production or PR Istanbul play URL.');
const cover=new URL('art/reskin/table-background.png',url).href;
const launchFields={WebURL:url.href,GameroomEnabled:'integrated'};
const account=auth.getGlobalDefaultAccount();await requireAuth({project:'launcherui',...account});
const {access_token}=await auth.getAccessToken(account.tokens.refresh_token,[]);
const headers={Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},base='https://firestore.googleapis.com/v1/projects/launcherui/databases/(default)/documents';
type CatalogueDocument={name:string;fields:Record<string,{stringValue?:string}>;updateTime:string};
const documents:CatalogueDocument[]=[];
let pageToken='';
do {
 const response=await fetch(`${base}/Applications?pageSize=1000${pageToken?`&pageToken=${encodeURIComponent(pageToken)}`:''}`,{headers});
 if(!response.ok)throw Error(`Catalogue read failed (${response.status}).`);
 const page=await response.json() as {documents?:CatalogueDocument[];nextPageToken?:string};
 documents.push(...(page.documents??[]));pageToken=page.nextPageToken??'';
} while(pageToken);
const snapshot={documents};
const matching=documents.filter(d=>d.name.toLowerCase().endsWith('/istanbul')||d.fields.WebURL?.stringValue?.includes('/istanbul/')||d.fields.Title?.stringValue?.replace(/[’']/g,'').toLowerCase()==='istanbul');
if(matching.length>1)throw Error('Multiple Istanbul records exist; review them before editing.');
const existing=matching[0];
const record=existing?launchFields:{Title:'Istanbul',Hidden:true,Icon:cover,...launchFields};
const fields=Object.fromEntries(Object.entries(record).map(([key,value])=>[key,typeof value==='boolean'?{booleanValue:value}:{stringValue:value}]));
console.log(JSON.stringify({document:existing?.name??'Applications/istanbul',...record},null,2));
if(!process.argv.includes('--apply')){console.log('Dry run. Use --apply after the play URL and cover are deployed.');process.exit(0);}
for(const target of [url.href,cover]){const check=await fetch(target);if(!check.ok)throw Error(`Deploy the asset first: ${target} (${check.status})`);}
const contract=await fetch(new URL('gameroom-launch.json',url));
const manifest=await contract.json();
if(!contract.ok||manifest.game!=='istanbul'||manifest.protocol!=='gameroom-url'||manifest.version!==1)throw Error('Deploy the integrated game before enabling its catalogue entry.');
const backup=`/tmp/istanbul-catalog-before-${Date.now()}.json`;writeFileSync(backup,JSON.stringify(snapshot,null,2));
const write={update:{name:existing?.name??'projects/launcherui/databases/(default)/documents/Applications/istanbul',fields},...(existing?{updateMask:{fieldPaths:Object.keys(record)},currentDocument:{updateTime:existing.updateTime}}:{currentDocument:{exists:false}})};
const result=await fetch(`${base}:commit`,{method:'POST',headers,body:JSON.stringify({writes:[write]})});if(!result.ok)throw Error(`Catalogue update failed (${result.status}): ${await result.text()}`);
console.log(`Updated only Istanbul. Previous catalogue saved to ${backup}.`);
