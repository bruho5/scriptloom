#!/usr/bin/env python3
"""Build native preview archives without a signer, installer or secret material.
Run from desktop/: python scripts/package.py
Requires go, node/npm; go-winres is run at pinned v0.3.3. No auto upload.
"""
import hashlib,json,os,pathlib,plistlib,shutil,struct,subprocess,tarfile,zipfile
root=pathlib.Path(__file__).resolve().parents[1];os.chdir(root)
version=json.loads(pathlib.Path('package.json').read_text())['version']
go=os.environ.get('SCRIPTLOOM_GO','go');out=root/'out'/'packages';out.mkdir(parents=True,exist_ok=True)
subprocess.run(['npm','run','build:web'],check=True)
subprocess.run([go,'run','github.com/tc-hib/go-winres@v0.3.3','make','--arch','amd64'],check=True)
artifacts=[]
for system,arch,label in [('windows','amd64','windows-x64'),('linux','amd64','linux-x64'),('darwin','arm64','macos-arm64'),('darwin','amd64','macos-x64')]:
 stage=out/label
 if stage.exists():shutil.rmtree(stage)
 stage.mkdir()
 (stage/'BUILD-INFO.json').write_text(json.dumps({'version':version,'source_commit':os.environ.get('SCRIPTLOOM_SOURCE_COMMIT','unrecorded local build'),'os':system,'arch':arch},indent=2)+'\n')
 if system=='darwin':
  content=stage/'Scriptloom.app'/'Contents';(content/'MacOS').mkdir(parents=True);(content/'Resources').mkdir()
  exe=content/'MacOS'/'Scriptloom'
  info={'CFBundleIdentifier':'io.github.bruho5.scriptloom','CFBundleName':'Scriptloom','CFBundleDisplayName':'Scriptloom','CFBundleExecutable':'Scriptloom','CFBundlePackageType':'APPL','CFBundleVersion':'0.2.0','CFBundleShortVersionString':'0.2.0','LSMinimumSystemVersion':'13.0','NSPrincipalClass':'NSApplication','NSHighResolutionCapable':True,'CFBundleIconFile':'Scriptloom.icns'}
  (content/'Info.plist').write_bytes(plistlib.dumps(info));(content/'PkgInfo').write_bytes(b'APPL????')
  chunks=[]
  for size,kind in [(16,b'icp4'),(32,b'icp5'),(64,b'icp6'),(128,b'ic07'),(256,b'ic08')]:
   png=(root/'assets'/f'scriptloom-{size}.png').read_bytes();chunks.append(kind+struct.pack('>I',len(png)+8)+png)
  body=b''.join(chunks);(content/'Resources'/'Scriptloom.icns').write_bytes(b'icns'+struct.pack('>I',len(body)+8)+body)
 else:exe=stage/('Scriptloom.exe' if system=='windows' else 'Scriptloom')
 flags='-s -w -X github.com/egoist/mygo.production=1'+(' -H windowsgui' if system=='windows' else '')
 env={**os.environ,'GOOS':system,'GOARCH':arch,'CGO_ENABLED':'0'}
 subprocess.run([go,'build','-tags','mygo_noinspector','-buildvcs=false','-trimpath','-ldflags='+flags,'-o',str(exe),'.'],check=True,env=env)
 exe.chmod(0o755)
 shutil.copyfile(root/'LICENSE',stage/'LICENSE');shutil.copytree(root/'licenses',stage/'licenses')
 shutil.copyfile(root/'PLATFORM-NOTES.md',stage/'README.md')
 if system=='linux':shutil.copyfile(root/'assets/scriptloom.png',stage/'scriptloom.png')
 name=f'Scriptloom-{version}-{label}'
 if system=='linux':
  dest=out/(name+'.tar.gz')
  with tarfile.open(dest,'w:gz') as t:t.add(stage,arcname='Scriptloom')
 else:
  dest=out/(name+'.zip')
  with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
   for file in sorted(stage.rglob('*')):
    if file.is_file():z.write(file,'Scriptloom/'+str(file.relative_to(stage)))
 artifacts.append(dest)
# The Windows binary is additionally available without an archive.
standalone=out/'Scriptloom.exe';shutil.copyfile(out/'windows-x64/Scriptloom.exe',standalone);artifacts.append(standalone)
checks=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in artifacts)
(out/'SHA256SUMS.txt').write_text(checks);print(checks)
