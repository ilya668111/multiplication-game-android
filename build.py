import pathlib,subprocess,os,zipfile
root=pathlib.Path(__file__).resolve().parent;tc=pathlib.Path(os.environ['ANDROID_SDK_ROOT']);src=root/'android';out=root/'build';out.mkdir(exist_ok=True)
jdk=pathlib.Path(os.environ['JAVA_HOME']);bt=tc/'build-tools/36.0.0';jar=tc/'platforms/android-36/android.jar'
env={**os.environ,'JAVA_HOME':str(jdk),'PATH':str(jdk/'bin')+':'+os.environ['PATH']}
def run(*a):subprocess.run([str(v) for v in a],env=env,check=True)
run(bt/'aapt2','compile','--dir',src/'res','-o',out/'resources.zip')
run(bt/'aapt2','link','-o',out/'unsigned.apk','-I',jar,'--manifest',src/'AndroidManifest.xml','-A',src/'assets',out/'resources.zip')
(out/'classes').mkdir(exist_ok=True);(out/'dex').mkdir(exist_ok=True)
run(jdk/'bin/javac','-encoding','UTF-8','--release','8','-classpath',jar,'-d',out/'classes',*src.glob('src/**/*.java'))
run(bt/'d8','--release','--min-api','26','--lib',jar,'--output',out/'dex',*out.glob('classes/**/*.class'))
with zipfile.ZipFile(out/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
 for p in (out/'dex').glob('*.dex'):z.write(p,p.name)
run(bt/'zipalign','-f','-p','4',out/'unsigned.apk',out/'aligned.apk')
key=root/'mayusha-signing.p12';pwd=root/'signing-password.txt'
if not key.exists():
 import secrets
 pwd.write_text(secrets.token_urlsafe(32));pwd.chmod(0o600)
 run(jdk/'bin/keytool','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass:file',pwd,'-alias','mayusha','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Mayusha Game, OU=Personal App, O=Mayusha')
 key.chmod(0o600)
final=root/'Mayusha.apk'
run(bt/'apksigner','sign','--v4-signing-enabled','false','--ks',key,'--ks-pass','file:'+str(pwd),'--out',final,out/'aligned.apk')
run(bt/'apksigner','verify','--verbose',final)
run(bt/'zipalign','-c','-p','4',final)
run(bt/'aapt2','dump','badging',final)
print('APK',final,final.stat().st_size)
