import { Injectable } from '@angular/core';
import { Paper } from '../models/paper.model';
import { SimplifiedPaper } from '../models/simplified-paper.model';
import { SimplifiedAuthor } from '../models/simplified-author.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthorsService } from './authors.service';
import { Subject } from 'rxjs';

export interface ResponsePaper {
  id: string;
  title: string;
  authors: string[];
  topics: string[];
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class PapersService {
  // TODO: Change when connecting to server
  // It represents the size of the chunks retrieved from the server (pagination)
  private _blockSize = 6;

  private papers: Paper[] = [];
  private _simplifiedPapers = new Subject<SimplifiedPaper[]>();

  get simplifiedPapers() {
    return this._simplifiedPapers.asObservable();
  }

  constructor(
    private http: HttpClient,
    private authorsService: AuthorsService
  ) {}

  get blockSize(): number {
    return this._blockSize;
  }

  getSimplifiedPapersBlock(
    query: string,
    block: number,
    old: SimplifiedPaper[]
  ) {
    // Guarda sul cellulare per foto di descrizione di come sara` popolato il JSON e su come strutturare richiesta
    // In linea di massima GET request con campi: > type= che rappresenta il tipo di richiesta a seconda della tab dalla quale e` effettuata
    //                                            > query= query sparql codificata in URI
    const linesPerQuery = 1000;
    const linesOffset = linesPerQuery * block;
    const request = `PREFIX gpp:<http://geranium-project.org/publications/>
PREFIX gpk:<http://geranium-project.org/keywords/>
PREFIX purl:<http://purl.org/dc/terms/>
PREFIX dbp:<http://dbpedia.org/resource/>
PREFIX gpo:<http://geranium-project.org/ontology/>
SELECT DISTINCT ?title ?author ?coauthor ?topic ?date ?abstract ?id
WHERE
{ ?p           purl:subject ?sub.
  ?sub         rdfs:label "${query}".
  ?p           purl:identifier ?id.
  ?p           rdfs:label ?publication.
  ?p           purl:creator ?a.
  ?a           rdfs:label ?author.
  ?p           purl:contributor ?ca.
  ?ca          rdfs:label ?coauthor.
  ?p              purl:subject ?t.
  ?p              rdfs:label ?title.
  ?t           rdf:type gpo:TMFResource.
  ?t           rdfs:label ?topic.
  ?p           purl:abstract ?abstract.
  ?p           purl:dateSubmitted ?date
}LIMIT ${linesPerQuery} OFFSET ${linesOffset}`;
    this.http
      .get<ResponsePaper[]>(
        'http://api.geranium.nexacenter.org/api?type=publication&query=' +
          encodeURI(request)
      )
      .subscribe(response => {
        for (const paper of response) {
          const authors: SimplifiedAuthor[] = [];
          for (let i = 0; i < paper.authors.length; i++) {
            authors.push(new SimplifiedAuthor(i.toString(), paper.authors[i]));
          }
          old.push(
            new SimplifiedPaper(
              this.cleanID(paper.id),
              paper.title,
              authors,
              paper.topics,
              new Date(paper.date),
              'https://img.purch.com/w/660/aHR0cDovL3d3dy5saXZlc2NpZW5jZS5jb20vaW1hZ2VzL2kvMDAwLzA5Ni8xMTEvb3JpZ2luYWwvcG9seXBlcHRpZGUuanBn'
            )
          );
        }
        this._simplifiedPapers.next(old);
      });
    /* for (const paper of this.simplifiedPapers) {
      for (const author of paper.authors) {
        author.name = this.authorsService.simplifyAuthorName(author.name);
      }
    } */
  }

  private cleanID(dirty: string) {
    return dirty.replace('/', '-');
  }

  getPaperFromId(id: string): Paper {
    return this.papers.find(p => p.id === id);
  }
}
