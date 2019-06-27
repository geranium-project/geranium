import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { AuthorsService } from './authors.service';
import { map } from 'rxjs/operators';

// Import models
import { Paper } from '../models/paper.model';
import { SimplifiedPaper } from '../models/simplified-paper.model';
import { SimplifiedAuthor } from '../models/simplified-author.model';
import { Topic } from '../models/topic.model';

export interface ResponsePaper {
  id: string;
  title: string;
  author: string[];
  topics: string[];
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class PapersService {

  private papers = []

  constructor(
    private http: HttpClient,
    private authorsService: AuthorsService
  ) { }

  /**
   * Send HTTP GET request for all the publications inherent a specific topic, passed as parameter.
   *
   * @param query the topic to be used for the search
   * @param block the current pagination block
   */
  getSimplifiedPapersBlock(query: string, block: number) {

    const linesPerQuery = 300;
    const linesOffset = linesPerQuery * block;
    const url = 'http://api.geranium.nexacenter.org/api?'
              + encodeURI(`type=publications&topic=${query}&lines=${linesPerQuery}&offset=${linesOffset}`);

    console.log("GET: " + url);

    return this.http
      .get<ResponsePaper[]>(url)
      .pipe(
        map(response => {
          const newPapers: SimplifiedPaper[] = [];

          for (const paper of response) {

            // build authors of the paper
            const authors: SimplifiedAuthor[] = [];
            for (let i = 0; i < paper.author.length; i++) {
              authors.push(
                new SimplifiedAuthor(
                  i.toString(),
                  this.authorsService.simplifyAuthorName(paper.author[i])
                )
              );
            }

            // build topics
            const topics: Topic[] = [];
            for (let i = 0; i < paper.topics.length; i++) {
              const topic = paper.topics[i];
              topics.push(new Topic(topic['url'], topic['label']))
            }

            // build paper
            newPapers.push(
              new SimplifiedPaper(
                this.cleanID(paper.id),
                paper.title,
                authors,
                topics,
                new Date(paper.date),
                'https://img.purch.com/w/660/aHR0cDovL3d3dy5saXZlc2NpZW5jZS5jb20vaW1hZ2VzL2kvMDAwLzA5Ni8xMTEvb3JpZ2luYWwvcG9seXBlcHRpZGUuanBn'
              )
            );
          }

          this.papers = newPapers;
          return newPapers;
        })
      );
  }

  private cleanID(dirty: string) {
    return dirty.replace('/', '-');
  }

  getPaperFromId(id: string): Paper {
    return this.papers.find(p => p.id === id);
  }
}
