import glob
import requests
import uvicorn

if __name__ == '__main__':


    print('Check for existing .rdf file...')

    if glob.glob('*.rdf'):
        # file(s) exist -> do something
        print('Found a .rdf file.\nImporting into Blazegraph...')
        files = glob.glob('*.rdf')
        rdf = None
        with open(files[0], 'r', encoding='utf-8') as f:
            rdf = f.read()
        r = requests.post('http://blazegraph_service:9999/blazegraph/namespace/kb/sparql', data=rdf.encode('utf-8'), headers={
            'Content-Type': 'application/rdf+xml',})
        print('Operation successful. Starting backend service...')
        uvicorn.run("main:app",host='0.0.0.0', port=5000, reload=True)

    else:
        print('Error. No .rdf file found.')
        exit(0)