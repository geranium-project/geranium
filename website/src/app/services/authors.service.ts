import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

// Import models
import { Author, ExpandedAuthor, PapersPerTopics } from '../model/author.model';
import { Topic, TopicNoImg } from '../model/topic.model';
import { ModelService } from '../model/model.service';
import { SimplifiedPaper } from '../model/simplified-paper.model';
import { ConfigService } from '../config/config.service';

// Set interfaces to parse data
interface Publication {
  id: string;
  title: string;
  author: Author;
  co_authors: Author[];
  topics: Topic[];
  submittedDate: Date;
}

export interface ResponseAuthors {
  id: string;
  name: string;
  url: string;
  publications_on_topic: Publication[];
}

// XXX Should be removed because currently it is duplicated
// In the API publications should be replaced with publications_on_topic
export interface ResponseAuthor {
  id: string;
  name: string;
  url: string;
  publications: Publication[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthorsService {
  constructor(
    private http: HttpClient,
    private dataModel: ModelService,
    private config: ConfigService
  ) {}

  /**
   * Send HTTP GET request for all the authors that have publications inherent the topic passed as argument
   *
   * @param query the topic to be used as query
   * @param block the block of authors to show
   */
  getAuthorsBlock(
    topicQuery: TopicNoImg,
    block: number
  ): Observable<ResponseAuthors[]> {
    const linesPerQuery = 300;
    const linesOffset = linesPerQuery * block;
    const url =
      'http://' +
      this.config.baseURL +
      '/api?' +
      encodeURI(
        `type=authors&topic=${topicQuery.label}&lines=${linesPerQuery}&offset=${linesOffset}`
      );

    console.log('GET: ' + url);

    return this.http.get<ResponseAuthors[]>(url).pipe(
      tap(response => {
        for (const author of response) {
          // Get topics and number of occurences
          let allTopics: PapersPerTopics[] = [];
          for (const publication of author.publications_on_topic) {
            for (const topic of publication.topics) {
              const t = allTopics.find(x => x.url === topic.url);
              if (t !== undefined) {
                t.occ++;
                continue;
              }
              allTopics.push({
                url: topic.url,
                label: topic.label,
                occ: 1,
                style: {}
              });
            }
          }

          // Sort topics by number of occurences and convert to label
          const stringTopics: string[] = [];
          allTopics = allTopics.sort((a, b) => a.occ - b.occ);
          for (const topic of allTopics) {
            stringTopics.push(topic.label);
          }

          this.dataModel.addAuthor(
            new Author(
              author.id,
              this.dataModel.normalizeAuthorName(author.name),
              author.url,
              '',
              stringTopics,
              'assets/img/defaultAuthor.jpg',
              author.publications_on_topic.length,
              allTopics
            )
          );
        }
      })
    );
  }

  getAuthorFromURIandTopic(
    authorURI: string,
    topicLabel: string
  ): Observable<ResponseAuthor[]> {
    // Get the author data using its URI and the topicLabel through the API
    const url =
      'http://' +
      this.config.baseURL +
      '/api?' +
      encodeURI(
        `type=author&topic=${topicLabel}&lines=10000&offset=0&url=${authorURI}`
      );

    console.log('GET: ' + url);

    return this.http.get<ResponseAuthor[]>(url).pipe(
      tap(response => {
        for (const author of response) {
          // XXX This code is replicated, maybe you can use only one function
          let allTopics: PapersPerTopics[] = [];
          for (const publication of author.publications) {
            for (const topic of publication.topics) {
              const t = allTopics.find(x => x.url === topic.url);
              if (t !== undefined) {
                t.occ++;
                continue;
              }
              allTopics.push({
                url: topic.url,
                label: topic.label,
                occ: 1,
                style: {}
              });
            }
          }

          // Sort topics by number of occurences and convert to label
          const stringTopics: string[] = [];
          allTopics = allTopics.sort((a, b) => b.occ - a.occ);
          for (const topic of allTopics) {
            stringTopics.push(topic.label);
          }

          // XXX Papers and Publications should have the same structure
          const papers: SimplifiedPaper[] = [];
          for (const publication of author.publications) {
            let authors: Author[] = [];
            authors.push(publication.author);
            authors = authors.concat(publication.co_authors);
            papers.push(
              new SimplifiedPaper(
                this.dataModel.cleanID(publication.id),
                publication.title,
                authors,
                publication.topics,
                publication.submittedDate,
                ''
              )
            );
          }

          this.dataModel.setAuthorDetails(
            new ExpandedAuthor(
              author.id,
              this.dataModel.normalizeAuthorName(author.name),
              author.url,
              '',
              stringTopics,
              'assets/img/defaultAuthor.jpg',
              author.publications.length,
              allTopics,
              papers
            )
          );
          console.log(this.dataModel.getAuthorDetails());
        }
      })
    );
  }
}
